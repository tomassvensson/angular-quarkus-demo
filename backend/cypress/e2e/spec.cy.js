describe('Cognito Login Flow', () => {
  it('should allow public access to home page', () => {
    cy.visit('/');
    cy.contains('AWS Cognito Demo App');
    cy.contains('Sign in with Cognito');
  });

  // NOTE: Full E2E with real Cognito requires programmatically handling the external redirect that Cypress normally blocks or complex Origin commands.
  // This test checks the redirection initiation but stops before leaving the domain or handles the origin switch if configured.
  
  it('should redirect to Cognito when clicking login', () => {
    cy.visit('/');
    // Check href points to protection path
    cy.get('a[href="/user"]').should('exist');
    
    // We can't easily test the full external AWS flow in simple Cypress without `cy.origin` and valid credentials,
    // but we can verify the protected resource returns 302/redirect.
    cy.request({
      url: '/user',
      followRedirect: false
    }).then((response) => {
      expect(response.status).to.eq(302);
      expect(response.headers['location']).to.include('amazoncognito.com');
    });
  });

  /*
   * For a real login test with the provided credentials, we would use cy.origin()
   * Requires Cypress 9.6+ and experimentalSessionAndOrigin: true or newer versions.
   */
  it.skip('should login using real credentials (fake-user)', () => {
     cy.visit('/');
     cy.contains('Sign in with Cognito').click();
     
     cy.origin('amazoncognito.com', () => {
        cy.get('input[name="username"]').type('fakeuser2@tomas-svensson.de');
        cy.get('input[name="password"]').type('AAAAAAa1!');
        cy.get('input[name="signInSubmitButton"]').click();
     });
     
     // Should be back on localhost
     cy.url().should('include', 'localhost:8080');
     cy.contains('Hello, fakeuser2');
     cy.contains('Sign Out');
  });
});
