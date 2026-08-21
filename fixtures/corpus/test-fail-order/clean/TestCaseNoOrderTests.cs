using NUnit.Framework;

[TestFixture]
public class TestCaseNoOrderTests
{
    [TestCase(1)]
    [TestCase(2)]
    public void Parameterized(int value)
    {
        Assert.That(value, Is.GreaterThan(0));
    }
}
