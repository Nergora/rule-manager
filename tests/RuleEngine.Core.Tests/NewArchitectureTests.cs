using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using RuleEngine.Core.Cache;
using RuleEngine.Core.Models;
using RuleEngine.Core.Rule;

namespace RuleEngine.Core.Tests;

public class RuleRuntimeExceptionTests
{
    [Fact]
    public async Task RuleSet_GetResult_ShouldThrowRuleRuntimeException_WithCode()
    {
        var predicateRule = await new RuleCompiler<TestRuleInput, bool>()
            .CompileAsync("P", "true");
        var badResult = await new RuleCompiler<TestRuleInput, TestRuleOutput>(useExpressionTreeTemplate: false)
            .CompileAsync("BadPredResult", "throw new System.Exception(\"boom\");");

        var ruleSet = RuleSet.Create("BadCode", predicateRule, badResult, 7);

        var act = () => ruleSet.GetResult(new TestRuleInput());
        act.Should().Throw<RuleRuntimeException>()
            .Which.Code.Should().Be("BadCode");
    }

    [Fact]
    public async Task RuleSet_GetResult_ShouldThrowRuleRuntimeException_WithPriority()
    {
        var predicateRule = await new RuleCompiler<TestRuleInput, bool>()
            .CompileAsync("P", "true");
        var badResult = await new RuleCompiler<TestRuleInput, TestRuleOutput>(useExpressionTreeTemplate: false)
            .CompileAsync("BadResult", "throw new System.Exception(\"boom result\");");

        var ruleSet = RuleSet.Create("ResultCode", predicateRule, badResult, 42);

        var act = () => ruleSet.GetResult(new TestRuleInput());
        act.Should().Throw<RuleRuntimeException>()
            .Which.Priority.Should().Be(42);
    }

    [Fact]
    public void RuleRuntimeException_Constructor_ShouldSetAllFields()
    {
        var inner = new InvalidOperationException("inner");
        var ex = new RuleRuntimeException(inner, "rule_string", "serialized_input", "MY_CODE", 99);

        ex.Code.Should().Be("MY_CODE");
        ex.Input.Should().Be("serialized_input");
        ex.Priority.Should().Be(99);
        ex.InnerException.Should().Be(inner);
    }
}

public class MemoryRuleCompilerCacheTests
{
    [Fact]
    public async Task Cache_ShouldReturnCachedResult_OnSecondCall()
    {
        var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var cache = new MemoryRuleCompilerCache(memoryCache);

        var callCount = 0;
        Task<IList<CompiledRule<TestRuleInput, bool>>> Factory()
        {
            callCount++;
            return Task.FromResult<IList<CompiledRule<TestRuleInput, bool>>>(
                new List<CompiledRule<TestRuleInput, bool>>
                {
                    new CompiledRule<TestRuleInput, bool>(input => true, DateTime.UtcNow)
                });
        }

        var result1 = await cache.GetOrAddAsync("key1", Factory);
        var result2 = await cache.GetOrAddAsync("key1", Factory);

        result1.Should().BeSameAs(result2);
        callCount.Should().Be(1, "factory should only be called once due to caching");
    }

    [Fact]
    public async Task Cache_ShouldCallFactory_ForDifferentKeys()
    {
        var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var cache = new MemoryRuleCompilerCache(memoryCache);

        var callCount = 0;
        Task<IList<CompiledRule<TestRuleInput, bool>>> Factory()
        {
            callCount++;
            return Task.FromResult<IList<CompiledRule<TestRuleInput, bool>>>(new List<CompiledRule<TestRuleInput, bool>>());
        }

        await cache.GetOrAddAsync("key-a", Factory);
        await cache.GetOrAddAsync("key-b", Factory);

        callCount.Should().Be(2);
    }
}

public class RuleScopeTests
{
    [Fact]
    public void RuleScope_Get_ShouldReturnSetInput_WithinScope()
    {
        var input = new TestRuleInput { IntProp = 42 };

        using (var scope = RuleScope.Begin())
        {
            scope.Set(input);
            RuleScope.Get<TestRuleInput>().Should().Be(input);
        }

        // After disposal, scope should be gone.
        RuleScope.Get<TestRuleInput>().Should().BeNull();
    }

    [Fact]
    public void RuleScope_NestedScopes_ShouldRestoreParentOnDispose()
    {
        var outer = new TestRuleInput { IntProp = 1 };
        var inner = new TestRuleInput { IntProp = 2 };

        using var outerScope = RuleScope.Begin();
        outerScope.Set(outer);

        using (var innerScope = RuleScope.Begin())
        {
            innerScope.Set(inner);
            RuleScope.Get<TestRuleInput>()!.IntProp.Should().Be(2);
        }

        RuleScope.Get<TestRuleInput>()!.IntProp.Should().Be(1);
    }

    [Fact]
    public async Task RuleScope_ShouldFlow_AcrossAsyncContext()
    {
        var input = new TestRuleInput { IntProp = 99 };

        using var scope = RuleScope.Begin();
        scope.Set(input);

        // AsyncLocal should flow into async continuations
        var retrieved = await Task.Run(() => RuleScope.Get<TestRuleInput>());
        retrieved.Should().NotBeNull();
        retrieved!.IntProp.Should().Be(99);
    }
}

public class RuleCompilerGlobalsTests
{
    [Fact]
    public void AddTypes_ShouldBeThreadSafe()
    {
        var tasks = Enumerable.Range(0, 20).Select(_ => Task.Run(() =>
        {
            RuleCompilerGlobals.AddTypes(typeof(System.Text.StringBuilder));
        }));

        var act = async () => await Task.WhenAll(tasks);
        act.Should().NotThrowAsync();
    }

    [Fact]
    public void Version_ShouldBeString()
    {
        RuleCompilerGlobals.Version.Should().BeOfType<string>();
        RuleCompilerGlobals.Version.Should().NotBeNullOrEmpty();
    }
}

public class ProviderWorkerInitializationTests
{
    [Fact]
    public async Task WaitInitialization_ShouldNotThrow_WhenInitializedQuickly()
    {
        var provider = new TestRuleProvider(new Dictionary<string, TestResultRuleSet>());
        var worker = new ProviderWorker<TestResultRuleSet, TestRuleInput, TestRuleOutput>(provider);

        await worker.ProcessAsync(); // triggers initialization

        var act = () => worker.WaitInitialization();
        act.Should().NotThrow();
    }

    [Fact]
    public async Task WaitInitializationAsync_ShouldComplete_WhenInitialized()
    {
        var provider = new TestRuleProvider(new Dictionary<string, TestResultRuleSet>());
        var worker = new ProviderWorker<TestResultRuleSet, TestRuleInput, TestRuleOutput>(provider);

        _ = Task.Run(async () =>
        {
            await Task.Delay(100);
            await worker.ProcessAsync();
        });

        var act = async () => await worker.WaitInitializationAsync();
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task Execute_ShouldReturnResults_ForMatchingPredicates()
    {
        var compiler = new RuleCompiler<TestRuleInput, bool>();
        var resultCompiler = new RuleCompiler<TestRuleInput, TestRuleOutput>(useExpressionTreeTemplate: false);

        var trueRule = await compiler.CompileAsync("true_pred", "true");
        var falseRule = await compiler.CompileAsync("false_pred", "false");
        var resultRule = await resultCompiler.CompileAsync("result", "Output.TotalPrice = 100;");

        var ruleSets = new Dictionary<string, TestResultRuleSet>
        {
            { "Match", new TestResultRuleSet("Match", trueRule, resultRule, 1) },
            { "NoMatch", new TestResultRuleSet("NoMatch", falseRule, resultRule, 2) }
        };

        var provider = new TestRuleProvider(ruleSets);
        var worker = new ProviderWorker<TestResultRuleSet, TestRuleInput, TestRuleOutput>(provider);
        await worker.ProcessAsync();

        var results = worker.Execute(new TestRuleInput()).ToList();
        results.Should().HaveCount(1);
        results[0].TotalPrice.Should().Be(100);
    }
}
