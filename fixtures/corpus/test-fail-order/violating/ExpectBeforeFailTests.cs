using NUnit.Framework;

[TestFixture]
public class ExpectBeforeFailTests
{
    [Test]
    public void ExpectThenFail()
    {
        Expect(Page.Locator("body")).ToBeVisibleAsync();
        Assert.Fail("PROJ-1: not working yet");
    }

    private dynamic Page => null;
}
