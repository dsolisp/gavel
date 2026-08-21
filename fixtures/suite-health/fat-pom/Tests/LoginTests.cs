using Microsoft.Playwright;
using NUnit.Framework;

namespace FatPom.Tests;

[TestFixture]
public class LoginTests
{
    private IPage _page;

    [SetUp]
    public async Task SetUp()
    {
        var playwright = await Playwright.CreateAsync();
        var browser = await playwright.Chromium.LaunchAsync();
        _page = await browser.NewPageAsync();
    }

    [Test]
    public async Task SubmitRequiresEmail()
    {
        await _page.GotoAsync("https://example.com/login");
        // selector-leak: raw GetByLabel outside a locator class
        await _page.GetByLabel("Email").FillAsync("a@b.com");
    }
}
