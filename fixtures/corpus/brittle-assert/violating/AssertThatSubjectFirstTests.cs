using NUnit.Framework;

namespace Gavel.Fixtures;

public class AssertThatSubjectFirstTests
{
    [Test]
    public void WelcomeMessageMatches()
    {
        Assert.That("home", Is.EqualTo("Welcome back home!"));
    }
}
