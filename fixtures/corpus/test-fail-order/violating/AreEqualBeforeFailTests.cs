using NUnit.Framework;

[TestFixture]
public class AreEqualBeforeFailTests
{
    [Test]
    public void AreEqualThenFail()
    {
        Assert.AreEqual(42, 42);
        Assert.Fail();
    }
}
