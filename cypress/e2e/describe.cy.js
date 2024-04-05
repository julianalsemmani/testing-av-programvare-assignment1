describe('Customer Care Page Interaction', () => {
  // it('passes', () => {
  //   cy.visit('https://parabank.parasoft.com/parabank/index.htm')
  // })

  it('Customer Care Page Interaction', () => {
    cy.visit("https://parabank.parasoft.com/parabank/index.htm")

    cy.get("li").contains("contact").click()

    cy.get('input[name="name"]').type('Ola Normann')
    cy.get('input[name="email"]').type('ola@normann.no')
    cy.get('input[name="phone"]').type('1234567890')
    cy.get('textarea[name="message"]').type('This is a test message.')

    cy.get('input').contains('Send to Customer Care').click()

    cy.get('body').should('contain', 'Thank you Ola Normann')
    cy.get('body').should('contain', 'A Customer Care Representative will be contacting you')
  })
})