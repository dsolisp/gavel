using NUnit.Framework;

namespace Sample;

public class LoginTests
{
    [Test]
    [Category("smoke")]
    [Category("ci.fast")]
    public void ValidLoginSucceeds()
    {
    }

    [Test]
    [Category("e2e-smoke")]
    public void SmokeEndToEndLogin()
    {
    }

    [Test]
    [Category("regression")]
    public void InvalidLoginShowsError()
    {
    }
}
