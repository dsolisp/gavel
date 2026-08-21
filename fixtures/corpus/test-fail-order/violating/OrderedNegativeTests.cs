using NUnit.Framework;

[TestFixture]
public class OrderedNegativeTests
{
    [Test(Order = 0)]
    public void Zero() { }

    [Test(Order = -1)]
    public void Negative() { }
}
