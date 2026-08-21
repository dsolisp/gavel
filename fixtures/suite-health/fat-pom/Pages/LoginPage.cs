using Microsoft.Playwright;

namespace FatPom.Pages;

// Fat POM: owns both locator properties and action methods.
// Every locator here is a selector-leak because this is not a locator file.
public class LoginPage
{
    private readonly IPage _page;

    public LoginPage(IPage page) => _page = page;

    public ILocator SubmitButton => _page.GetByRole(AriaRole.Button, new() { NameString = "Submit" });

    public ILocator EmailField => _page.GetByLabel("Email");

    public async Task SignInAsync(string email)
    {
        await EmailField.FillAsync(email);
        await SubmitButton.ClickAsync();
    }
}
