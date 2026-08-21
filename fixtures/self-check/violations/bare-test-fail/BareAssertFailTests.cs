using NUnit.Framework;

[TestFixture]
public class BareAssertFailTests
{
    [Test]
    public void KnownRegression()
    {
        Assert.Fail();
    }
}
