describe('profile fixture', () => {
  it('uses cy.get with role selector', () => {
    cy.get('[role="button"]').contains('Submit').click();
    cy.get('[aria-label="Email"]').should('be.visible');
  });
});
