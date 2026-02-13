#!/usr/bin/env bash
set -euo pipefail

ENDPOINT_URL="${ENDPOINT_URL:-http://localhost:4566}"
AWS_REGION="${AWS_REGION:-eu-central-1}"

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_DEFAULT_REGION="$AWS_REGION"

echo "Seeding LocalStack Cognito + SSM at ${ENDPOINT_URL}"

USER_POOL_ID=$(aws --endpoint-url "$ENDPOINT_URL" cognito-idp create-user-pool \
  --pool-name angular-quarkus-demo \
  --schema Name=email,AttributeDataType=String,Mutable=true,Required=true \
  --auto-verified-attributes email \
  --query 'UserPool.Id' --output text)

CLIENT_ID=$(aws --endpoint-url "$ENDPOINT_URL" cognito-idp create-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-name angular-quarkus-demo \
  --generate-secret \
  --allowed-o-auth-flows-user-pool-client \
  --allowed-o-auth-flows code \
  --allowed-o-auth-scopes openid email \
  --callback-urls "http://localhost:8080/login" "http://localhost:8081/login" "http://localhost:4200/" \
  --logout-urls "http://localhost:4200/" "http://localhost:8080/" "http://localhost:8081/" \
  --query 'UserPoolClient.ClientId' --output text)

CLIENT_SECRET=$(aws --endpoint-url "$ENDPOINT_URL" cognito-idp describe-user-pool-client \
  --user-pool-id "$USER_POOL_ID" \
  --client-id "$CLIENT_ID" \
  --query 'UserPoolClient.ClientSecret' --output text)

for GROUP in RegularUser AdminUser OwnerUser NoPermissionsTestUser; do
  aws --endpoint-url "$ENDPOINT_URL" cognito-idp create-group \
    --user-pool-id "$USER_POOL_ID" \
    --group-name "$GROUP" >/dev/null
done

create_user() {
  local username="$1"
  local email="$2"
  local group="$3"

  aws --endpoint-url "$ENDPOINT_URL" cognito-idp admin-create-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$username" \
    --temporary-password 'Test1234!' \
    --message-action SUPPRESS \
    --user-attributes Name=email,Value="$email" Name=email_verified,Value=true >/dev/null

  aws --endpoint-url "$ENDPOINT_URL" cognito-idp admin-set-user-password \
    --user-pool-id "$USER_POOL_ID" \
    --username "$username" \
    --password 'Test1234!' \
    --permanent >/dev/null

  aws --endpoint-url "$ENDPOINT_URL" cognito-idp admin-add-user-to-group \
    --user-pool-id "$USER_POOL_ID" \
    --username "$username" \
    --group-name "$group" >/dev/null
}

create_user "admin.user" "admin.user@example.com" "AdminUser"
create_user "regular.user" "regular.user@example.com" "RegularUser"
create_user "owner.user" "owner.user@example.com" "OwnerUser"
create_user "noperm.user" "noperm.user@example.com" "NoPermissionsTestUser"

aws --endpoint-url "$ENDPOINT_URL" ssm put-parameter \
  --name '/angular-quarkus-demo/oidc/client-id' \
  --type String \
  --value "$CLIENT_ID" --overwrite >/dev/null

aws --endpoint-url "$ENDPOINT_URL" ssm put-parameter \
  --name '/angular-quarkus-demo/oidc/client-secret' \
  --type SecureString \
  --value "$CLIENT_SECRET" --overwrite >/dev/null

aws --endpoint-url "$ENDPOINT_URL" ssm put-parameter \
  --name '/angular-quarkus-demo/user-pool-id' \
  --type String \
  --value "$USER_POOL_ID" --overwrite >/dev/null

echo "COGNITO_USER_POOL_ID=$USER_POOL_ID" >> "$GITHUB_ENV"
echo "COGNITO_CLIENT_ID=$CLIENT_ID" >> "$GITHUB_ENV"
echo "COGNITO_CLIENT_SECRET=$CLIENT_SECRET" >> "$GITHUB_ENV"

echo "Seeded LocalStack resources."
