using NUnit.Framework;

[TestFixture]
public class OrderedWithSetupTests
{
    [SetUp]
    public void Setup() { }

    [Test(Order = 1)]
    public void First() { }

    [Test(Order = 2)]
    public void Second() { }
}
