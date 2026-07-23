using System;
using System.Threading.Tasks;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class TaskDelayTests
{
    [Test]
    public async Task FixedTaskDelay()
    {
        await Task.Delay(2000);
    }
}
