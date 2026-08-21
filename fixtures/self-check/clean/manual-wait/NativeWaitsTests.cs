using System.Threading.Tasks;
using Gavel.Fixtures.Pages.Locators;
using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class NativeWaitsTests
{
    [Test]
    public async Task ExpectAutoRetry(IPage page)
    {
        // Native Expect instead of Thread.Sleep() — comment must not fire.
        // WaitForLoadStateAsync(LoadState.NetworkIdle) and networkidle in comments must not fire.
        await Expect(CheckoutLocators.TotalHeading(page)).ToBeVisibleAsync();
    }

    [Test]
    public async Task LoadStateDomContentLoaded(IPage page)
    {
        await page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);
    }

    [Test]
    public async Task LoadStateLoad(IPage page)
    {
        await page.WaitForLoadStateAsync(LoadState.Load);
    }
}
