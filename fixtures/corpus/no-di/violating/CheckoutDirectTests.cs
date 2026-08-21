using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class CheckoutDirectTests
{
    [Test]
    public void Checkout_ConstructsPageDirectly()
    {
        var checkoutPage = new CheckoutPage(null!);
        checkoutPage.CompletePurchase();
    }
}

public class CheckoutPage
{
    public CheckoutPage(IPage page) { }
    public void CompletePurchase() { }
}
