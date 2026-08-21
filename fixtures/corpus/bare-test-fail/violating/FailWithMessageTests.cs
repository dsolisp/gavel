using NUnit.Framework;

[TestFixture]
public class FailWithMessageTests
{
    [Test]
    public void FailsWithMessage()
    {
        Assert.Fail("something broke");
    }
}
