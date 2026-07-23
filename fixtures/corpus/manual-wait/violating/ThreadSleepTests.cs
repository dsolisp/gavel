using System.Threading;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class ThreadSleepTests
{
    [Test]
    public void IntentionalBotDelay()
    {
        Thread.Sleep(1500);
    }
}
