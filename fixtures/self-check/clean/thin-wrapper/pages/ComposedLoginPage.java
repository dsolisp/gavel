package thinwrapper.pages;

public class ComposedLoginPage {
    private final LoginLocators locators;

    public ComposedLoginPage(LoginLocators locators) {
        this.locators = locators;
    }

    public void signIn(String email, String password) {
        locators.email().fill(email);
        locators.password().fill(password);
        locators.submit().click();
    }
}
