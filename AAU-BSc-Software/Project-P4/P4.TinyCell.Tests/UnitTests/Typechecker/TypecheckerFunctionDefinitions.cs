using static P4.TinyCell.Tests.Utility;
using P4.TinyCell.Shared.Language.Typechecking;
using Antlr4.Runtime;
using P4.TinyCell.Shared.Utilities;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree;
using System.ComponentModel;

namespace P4.TinyCell.Tests.UnitTests.Typechecker;

public class TypecheckerFunctionDefinitions
{
    [Fact]
    [Description("Can handle a function definition with int return type")]
    public void TypecheckerFunctionDefIntReturn()
    {
        string input = @"
                int myFunction() {
                    return 5;
                }
                setup{}
                update{}
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle a function definition with void return type")]
    public void TypecheckerFunctionDefVoidReturn()
    {
        string input = @"
                void myFunction() {
                    // no return needed
                }
                setup{}
                update{}
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle a function definition with parameters")]
    public void TypecheckerFunctionDefWithParameters()
    {
        string input = @"
                int add(int a, int b) {
                    return a + b;
                }
                setup{}
                update{}
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle a function definition with different parameter types")]
    public void TypecheckerFunctionDefDifferentParamTypes()
    {
        string input = @"
                float multiply(int a, float b) {
                    return a * b;
                }
                setup{}
                update{}
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle nested function calls")]
    public void TypecheckerFunctionDefNestedCalls()
    {
        string input = @"
                int add(int a, int b) {
                    return a + b;
                }
                int multiply(int a, int b) {
                    return a * b;
                }
                int combined(int a, int b, int c) {
                    return add(multiply(a, b), c);
                }
                setup{}
                update{}
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Detects missing return statement in non-void function")]
    public void TypecheckerFunctionDefMissingReturn()
    {
        string input = @"
                int noReturn() {
                    int x = 5;
                    x = x + 2;
                    // Missing return statement
                }
                setup{}
                update{}
            ";

        var ex = CheckTypeErrors(input);
        Assert.NotNull(ex);
        Assert.Contains("not all paths return a value", ex.Message);
    }

    [Fact]
    [Description("Detects type mismatch in return statement")]
    public void TypecheckerFunctionDefTypeMismatchReturn()
    {
        string input = @"
                int returnString() {
                    return ""hello""; // Type mismatch
                }
                setup{}
                update{}
            ";

        var ex = CheckTypeErrors(input);
        Assert.NotNull(ex);
        Assert.Contains("Type mismatch", ex.Message);
    }

    [Fact]
    [Description("Can handle function with boolean return type")]
    public void TypecheckerFunctionDefBoolReturn()
    {
        string input = @"
                bool isEven(int number) {
                    return number % 2 == 0;
                }
                setup{}
                update{}
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle function with string return type")]
    public void TypecheckerFunctionDefStringReturn()
    {
        string input = @"
                string greet() {
                    return ""hello"";
                }
                setup{}
                update{}
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle function with multiple parameters and mixed operations")]
    public void TypecheckerFunctionDefMixedOperations()
    {
        string input = @"
                float complexCalculation(int a, float b, bool flag) {
                    if (flag) {
                        return a * b;
                    } else {
                        return a / b;
                    }
                    return 0.0;
                }
                setup{}
                update{}
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }
}