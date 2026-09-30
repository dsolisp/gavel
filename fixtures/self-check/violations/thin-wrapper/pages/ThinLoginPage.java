package thinwrapper.pages;

public class ThinLoginPage {
    private final ThinLocators locators;

    public ThinLoginPage(ThinLocators locators) {
        this.locators = locators;
    }

    // callSites <= 1 — should flag delete
    public void submit() {
        locators.submit().click();
    }
}
