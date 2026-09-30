namespace ThinWrapper.Pages;

public class DupBodyAlphaPage
{
    private readonly Locators.DupLocators _locators;

    public DupBodyAlphaPage(Locators.DupLocators locators) => _locators = locators;

    // Same normalized body as DupBodyBetaPage — bodyDupes > 1 → move
    public async System.Threading.Tasks.Task ConfirmDupAsync() => await _locators.OkButton.ClickAsync();
}
