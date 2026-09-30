namespace ThinWrapper.Pages;

public class DupBodyBetaPage
{
    private readonly Locators.DupLocators _locators;

    public DupBodyBetaPage(Locators.DupLocators locators) => _locators = locators;

    // Same normalized body as DupBodyAlphaPage — bodyDupes > 1 → move
    public async System.Threading.Tasks.Task ConfirmDupAsync() => await _locators.OkButton.ClickAsync();
}
