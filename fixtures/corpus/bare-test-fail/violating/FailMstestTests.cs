using Microsoft.VisualStudio.TestTools.UnitTesting;

[TestClass]
public class FailMstestTests
{
    [TestMethod]
    public void KnownFailure()
    {
        Assert.Fail();
    }
}
