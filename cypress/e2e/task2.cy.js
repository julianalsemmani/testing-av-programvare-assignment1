describe("Task 2", () => {
  beforeEach(() => {
    cy.visit("https://parabank.parasoft.com/parabank");
    cy.get('input[name="username"]').type("olanormann");
    cy.get('input[name="password"]').type("Test123!");
    cy.get("input").contains("Log In").click();
  });

  afterEach(() => {
    cy.get('a[href="/parabank/logout.htm"]').click();
  });

  it("Opens a new bank account", () => {
    cy.get('a[href="/parabank/openaccount.htm"]').click();

    cy.get("#type").select("1");

    cy.get("#type").should("have.value", "1");

    cy.wait(1000);

    cy.get('input[type="submit"]').click();

    cy.wait(2000);

    cy.get("body")
      .should("contain", "Congratulations, your account is now open.")
      .and("contain", "Your new account number: ")
      .then(($body) => {
        const bodyText = $body.text();

        const accountNumberMatch = bodyText.match(
          /Your new account number: (\d+)/
        );

        if (accountNumberMatch) {
          const accountNumber = accountNumberMatch[1];

          console.log("Extracted account number:", accountNumber);

          cy.wrap(accountNumber).as("accountNumber");
        }
      });

    cy.get('a[href="/parabank/overview.htm"]').click();

    cy.get("@accountNumber").then((accountNumber) => {
      cy.get("#accountTable")
        .contains("td", accountNumber)
        .then(($td) => {
          expect($td).to.exist;
        });
    });
  });

  it("Performs a bill payment", () => {
    cy.get('a[href="/parabank/overview.htm"]').click();

    cy.wait(2000);

    cy.get("#accountTable tbody tr").each(($row) => {
      const balanceText = $row
        .find("td:nth-child(2)")
        .text()
        .trim()
        .replace("$", "")
        .replace(",", "");
      const balance = parseFloat(balanceText);

      if (balance > 5000) {
        const accountNumber = $row.find("td:nth-child(1) a").text().trim();

        if (accountNumber) {
          cy.wrap(accountNumber).as("selectedAccountNumber");
        }
      }
    });

    cy.get('a[href="/parabank/billpay.htm"]').click();

    cy.get('input[name="payee.name"]').type("Kari Normann");
    cy.get('input[name="payee.address.street"]').type("Karis gate 1");
    cy.get('input[name="payee.address.city"]').type("Oslo");
    cy.get('input[name="payee.address.state"]').type("Oslo");
    cy.get('input[name="payee.address.zipCode"]').type("0123");
    cy.get('input[name="payee.phoneNumber"]').type("12345678");

    cy.get('input[name="payee.accountNumber"]').type("12345678");
    cy.get('input[name="verifyAccount"]').type("12345678");

    cy.get('input[name="amount"]').type(100);

    cy.get("@selectedAccountNumber").then((accountNumber) => {
      if (!accountNumber) {
        throw new Error("Account number is undefined or empty.");
      }
      cy.get('select[name="fromAccountId"]')
        .select(accountNumber)
        .should("have.value", accountNumber);
    });

    cy.get('input[type="submit"]').click();

    cy.wait(2000);

    cy.get("@selectedAccountNumber").then((accountNumber) => {
      cy.get("body").should(
        "contain",
        `Bill Payment to Kari Normann in the amount of $100.00 from account ${accountNumber} was successful.`
      );
    });

    cy.get("body").should("contain", "See Account Activity for more details.");

    cy.get('a[href="/parabank/overview.htm"]').click();

    cy.wait(1000);

    cy.get("@selectedAccountNumber").then((accountNumber) => {
      cy.get("a").contains(accountNumber).click();
    });

    cy.wait(1000);

    cy.get("a").contains("Bill Payment to Kari Normann");

    cy.get("td").contains("$100.00");
  });

  it("Transfer Funds between accounts", () => {
    cy.get('a[href="/parabank/overview.htm"]').click();

    cy.wait(2000);

    let accounts = [];

    cy.get("#accountTable tbody tr")
      .each(($row, index, $list) => {
        if (index < $list.length - 1) {
          const accountNumber = $row.find("td:nth-child(1) a").text();
          let balance = $row.find("td:nth-child(2)").text().trim();

          balance = parseFloat(balance.replace(/[$,]/g, ""));

          accounts.push({ accountNumber, balance });
        }
      })
      .then(() => {
        accounts.sort((a, b) => b.balance - a.balance);

        const highestBalanceAccount = accounts[0].accountNumber;
        cy.log("Account with the most money:", highestBalanceAccount);

        if (highestBalanceAccount) {
          cy.wrap(highestBalanceAccount).as("highestBalanceAccount");
        }

        accounts.shift();

        const randomAccount = accounts[1].accountNumber;
        const randomAccountBalance = accounts[1].balance;

        if (randomAccount) {
          cy.wrap(randomAccount).as("randomAccount");
          cy.wrap(randomAccountBalance).as("randomAccountBalance");
        }

        cy.log("Randomly selected account:", randomAccount);
        cy.log("Balance of randomly selected account:", randomAccountBalance);
      });

    cy.get('a[href="/parabank/transfer.htm"]').click();

    cy.wait(1000);

    cy.get('input[name="input"]').type("1000");

    cy.get("@highestBalanceAccount").then((accountNumber) => {
      if (!accountNumber) {
        throw new Error("Account number is undefined or empty.");
      }
      cy.get('select[id="fromAccountId"]')
        .select(accountNumber)
        .should("have.value", accountNumber);
    });

    cy.get("@randomAccount").then((accountNumber) => {
      if (!accountNumber) {
        throw new Error("Account number is undefined or empty.");
      }
      cy.get('select[id="toAccountId"]')
        .select(accountNumber)
        .should("have.value", accountNumber);
    });

    cy.get('input[type="submit"]').click();

    cy.get("@highestBalanceAccount").then((accountNumber) => {
      cy.get("@randomAccount").then((randomAccount) => {
        cy.get("body").should(
          "contain",
          `$1000.00 has been transferred from account #${accountNumber} to account #${randomAccount}.`
        );
      });
    });

    cy.get("body").should("contain", "See Account Activity for more details.");

    cy.get('a[href="/parabank/overview.htm"]').click();

    cy.wait(1000);

    cy.get("@randomAccount").then((accountNumber) => {
      if (!accountNumber) {
        throw new Error("Account number is undefined or empty.");
      }

      cy.get("@randomAccountBalance").then((initialBalance) => {
        cy.get("#accountTable tbody tr").each(($row) => {
          const currentAccountNumber = $row.find("td:nth-child(1) a").text();
          if (currentAccountNumber === accountNumber) {
            let updatedBalance = $row.find("td:nth-child(2)").text().trim();
            updatedBalance = parseFloat(updatedBalance.replace(/[$,]/g, ""));

            expect(updatedBalance).to.eq(initialBalance + 1000);
          }
        });
      });
    });
  });
});
