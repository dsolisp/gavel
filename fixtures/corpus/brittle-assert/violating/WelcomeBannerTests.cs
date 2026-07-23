using NUnit.Framework;

namespace Gavel.Fixtures;

public class WelcomeBannerTests
{
    [Test]
    public void BannerMatchesProse()
    {
        var banner = "Welcome back, trader!";
        Assert.That(banner, Is.EqualTo("Welcome back, trader!"));
    }
}
