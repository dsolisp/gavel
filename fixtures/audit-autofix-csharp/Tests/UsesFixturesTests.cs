using AuditFixCs.Factories;
using AuditFixCs.Pages;
using AuditFixCs.Pages.Locators;
using Microsoft.Playwright;
using NUnit.Framework;

namespace AuditFixCs.Tests;

public class UsesFixturesTests
{
    [Test]
    public void UsesReferencedSymbols()
    {
        IPage page = null!;
        var used = new UsedPage(page);
        var locators = new LoginLocators(page);
        _ = locators.UsedButton;
        _ = UserFactory.CreateUsed();
        _ = used;
    }
}
