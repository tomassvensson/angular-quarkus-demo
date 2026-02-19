package org.acme;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class LinkResourceTest {

    @Test
    @TestSecurity(user = "user1", roles = {"RegularUser"})
    void testLinkFlowGraphQL() {
        // 1. Create List
        String createListVariables = "{\"name\": \"My GraphQL List\"}";
        String createListQuery = "mutation createList($name: String) { createList(name: $name) { id name owner published } }";
        
        String listId = given()
            .contentType(ContentType.JSON)
            .body("{\"query\": \"" + createListQuery.replace("\"", "\\\"") + "\", \"variables\": " + createListVariables + "}")
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.createList.name", is("My GraphQL List"))
                // Owner is set by server from security context
                .body("data.createList.owner", is("user1"))
                .body("data.createList.published", is(false))
                .extract().path("data.createList.id");

        // 2. Add Link to List
        // Using variables is cleaner for escaping
        String addVariables = String.format("{\"listId\": \"%s\", \"url\": \"https://gql.com\", \"title\": \"GQL\"}", listId);
        String addLinkQuery = "mutation addLinkToList($listId: String, $url: String, $title: String) { addLinkToList(listId: $listId, url: $url, title: $title) { id linkIds } }";

        given()
            .contentType(ContentType.JSON)
            .body("{\"query\": \"" + addLinkQuery.replace("\"", "\\\"") + "\", \"variables\": " + addVariables + "}")
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.addLinkToList.linkIds", hasSize(1));

        // 3. Get Details
        String getDetailsQuery = "query listDetails($id: String) { listDetails(id: $id) { list { id name } links { url title } } }";
        String getDetailsVars = String.format("{\"id\": \"%s\"}", listId);
        
        given()
            .contentType(ContentType.JSON)
            .body("{\"query\": \"" + getDetailsQuery.replace("\"", "\\\"") + "\", \"variables\": " + getDetailsVars + "}")
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.listDetails.list.id", is(listId))
                .body("data.listDetails.links[0].url", is("https://gql.com"));

        // 4. Publish List
        String updateQuery = "mutation updateList($id: String, $published: Boolean) { updateList(id: $id, published: $published) { published } }";
        String updateVars = String.format("{\"id\": \"%s\", \"published\": true}", listId);

        given()
            .contentType(ContentType.JSON)
            .body("{\"query\": \"" + updateQuery.replace("\"", "\\\"") + "\", \"variables\": " + updateVars + "}")
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.updateList.published", is(true));

        // 5. Check Published Lists
        String publishedQuery = "query { publishedLists { items { id } total } }";
        
        given()
            .contentType(ContentType.JSON)
            .body("{\"query\": \"" + publishedQuery.replace("\"", "\\\"") + "\"}")
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.publishedLists.items.id", hasItem(listId));

        // 6. Delete List
        String deleteQuery = "mutation deleteList($id: String) { deleteList(id: $id) }";
        String deleteVars = String.format("{\"id\": \"%s\"}", listId);
        
        given()
            .contentType(ContentType.JSON)
            .body("{\"query\": \"" + deleteQuery.replace("\"", "\\\"") + "\", \"variables\": " + deleteVars + "}")
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(200)
                .body("data.deleteList", is(true));
    }

    @Test
    void testUnauthenticatedPublishedLists() {
        // Accessing publishedLists without auth should fail (GraphQL error or 401 depending on config)
        // Since we allow public access to /api/v1/graphql, the security check happens at method level
        // and SmallRye GraphQL catches the exception returning 200 with errors.
        String publishedQuery = "query { publishedLists { items { id } } }";
        
        given()
            .contentType(ContentType.JSON)
            .body("{\"query\": \"" + publishedQuery.replace("\"", "\\\"") + "\"}")
            .when().post("/api/v1/graphql")
            .then()
                .statusCode(anyOf(is(200), is(401))) // Accept either, then check body if 200
                .body(containsString("errors")); 
    }
}
