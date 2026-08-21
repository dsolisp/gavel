using Microsoft.VisualStudio.TestTools.UnitTesting;

[TestClass]
public class CleanMstestTests
{
    [TestMethod]
    public void NormalAssertion()
    {
        Assert.AreEqual(42, 42);
    }
}
