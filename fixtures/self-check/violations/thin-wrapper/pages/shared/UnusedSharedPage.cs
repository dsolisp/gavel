namespace ThinWrapper.Pages.Shared;

public class UnusedSharedPage
{
    private readonly ThinWrapper.Pages.Locators.ThinLocators _locators;

    public UnusedSharedPage(ThinWrapper.Pages.Locators.ThinLocators locators) => _locators = locators;

    // Shared path but callSites <= 1 — shared-yagni
    public async System.Threading.Tasks.Task OrphanClickAsync() => await _locators.SubmitButton.ClickAsync();
}
