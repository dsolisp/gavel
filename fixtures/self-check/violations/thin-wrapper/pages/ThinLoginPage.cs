namespace ThinWrapper.Pages;

public class ThinLoginPage
{
    private readonly Locators.ThinLocators _locators;

    public ThinLoginPage(Locators.ThinLocators locators) => _locators = locators;

    // callSites <= 1 — should flag delete
    public async System.Threading.Tasks.Task SubmitAsync() => await _locators.SubmitButton.ClickAsync();
}
