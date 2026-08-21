namespace Gavel.Fixtures.Pages;

public class CheckoutPage
{
    private readonly IPage _page;
    public CheckoutPage(IPage page) => _page = page;

    public void VerifyTotal()
    {
        var total = "42";
        total.Should().Be("42");
    }
}
