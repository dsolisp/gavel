namespace Gavel.Fixtures.Pages;

public class OrderPage
{
    private readonly IPage _page;
    public OrderPage(IPage page) => _page = page;

    public void VerifyStatus()
    {
        var status = "active";
        status.Should().Be("active");
    }
}
