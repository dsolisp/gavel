using Microsoft.Playwright;
using FatPom.Pages.Locators;

namespace FatPom.Pages;

// Dual API: re-exports named ILocator from locator class + owns actions.
// Must NOT count as fat POM — ILocator type alone is not selector ownership.
public class DualApiPage
{
    private readonly OkLocators _locators;

    public DualApiPage(IPage page) => _locators = new OkLocators(page);

    public ILocator SubmitButton => _locators.SubmitButton;

    public ILocator EmailField => _locators.EmailField;

    public async Task SignInAsync(string email)
    {
        await EmailField.FillAsync(email);
        await SubmitButton.ClickAsync();
    }
}
