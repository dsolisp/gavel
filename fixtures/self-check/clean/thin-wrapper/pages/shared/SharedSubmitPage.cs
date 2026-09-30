namespace ThinWrapper.Pages.Shared;

public class SharedSubmitPage
{
    private readonly ThinWrapper.Pages.Locators.LoginLocators _locators;

    public SharedSubmitPage(ThinWrapper.Pages.Locators.LoginLocators locators) => _locators = locators;

    // Shared + callSites > 1 (see Tests) — must stay clean
    public async System.Threading.Tasks.Task SharedSubmitAsync() => await _locators.SubmitButton.ClickAsync();
}
