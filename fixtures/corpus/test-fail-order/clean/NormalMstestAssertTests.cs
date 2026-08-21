using Microsoft.VisualStudio.TestTools.UnitTesting;

[TestClass]
public class NormalMstestAssertTests
{
    [TestMethod]
    public void SimpleAssert()
    {
        Assert.AreEqual(42, 42);
    }
}
