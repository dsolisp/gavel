using System;
using NUnit.Framework;

namespace Gavel.Fixtures;

public class EnvUrlTests
{
    [Test]
    public void ReadsBaseUrlFromEnvironment()
    {
        var baseUrl = Environment.GetEnvironmentVariable("BASE_URL");
    }
}
