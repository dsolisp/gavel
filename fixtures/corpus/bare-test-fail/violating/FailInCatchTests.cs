using NUnit.Framework;

[TestFixture]
public class FailInCatchTests
{
    [Test]
    public void CatchesAndFails()
    {
        try
        {
            var x = 1 / 0;
        }
        catch
        {
            Assert.Fail();
        }
    }
}
