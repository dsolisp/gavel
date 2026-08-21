using NUnit.Framework;

[TestFixture]
public class FailBeforeAssertTests
{
    [Test]
    public void FailBeforeAssert()
    {
        Assert.Fail("PROJ-1: known regression");
    }
}
