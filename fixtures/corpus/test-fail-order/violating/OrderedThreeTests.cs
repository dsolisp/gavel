using NUnit.Framework;

[TestFixture]
public class OrderedThreeTests
{
    [Test(Order = 3)]
    public void Third() { }

    [Test(Order = 1)]
    public void First() { }

    [Test(Order = 2)]
    public void Second() { }
}
