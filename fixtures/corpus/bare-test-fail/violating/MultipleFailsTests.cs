using NUnit.Framework;

[TestFixture]
public class MultipleFailsTests
{
    [Test]
    public void FirstFail()
    {
        Assert.Fail();
    }

    [Test]
    public void SecondFail()
    {
        Assert.Fail();
    }
}
