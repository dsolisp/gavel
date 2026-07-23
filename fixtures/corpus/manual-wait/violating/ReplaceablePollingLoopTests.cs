using System.Threading;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class ReplaceablePollingLoopTests
{
    [Test]
    public void PollingLoopSleep()
    {
        var ready = false;
        while (!ready)
        {
            Thread.Sleep(1000);
        }
    }
}
