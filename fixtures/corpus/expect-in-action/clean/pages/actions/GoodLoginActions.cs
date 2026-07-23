using OpenQA.Selenium;

namespace Gavel.Fixtures.Pages.Actions;

public class GoodLoginActions
{
    private readonly LoginLocators _locators;
    public GoodLoginActions(LoginLocators locators) => _locators = locators;

    public void Submit() => _locators.SubmitButton.Click();
}
