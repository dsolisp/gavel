using NUnit.Framework;

[TestFixture]
public class OrderedTests
{
    [Test(Order = 1)]
    public void First()
    {
    }

    [Test(Order = 2)]
    public void Second()
    {
    }
}
