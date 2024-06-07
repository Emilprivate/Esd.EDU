using static P4.TinyCell.Tests.Utility;
using P4.TinyCell.Shared.Language.Typechecking;
using Antlr4.Runtime;
using P4.TinyCell.Shared.Utilities;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree;
using System.ComponentModel;

namespace P4.TinyCell.Tests.UnitTests.Typechecker;

public class TypecheckerControlFlow
{
    [Fact]
    [Description("Can handle nested if statements with multiple branches")]
    public void TypecheckerNestedIfStatements()
    {
        string input = @"
                setup{}
                update{
                    int x = 5;
                    int y = 10;
                    if (x < y) {
                        if (x == 5) {
                            x = x + 1;
                        } else {
                            x = x - 1;
                        }
                    } else {
                        if (y == 10) {
                            y = y + 1;
                        } else {
                            y = y - 1;
                        }
                    }
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle while loops with complex conditions")]
    public void TypecheckerComplexWhileLoop()
    {
        string input = @"
                setup{}
                update{
                    int x = 0;
                    while (x < 10 && x % 2 == 0) {
                        x = x + 2;
                    }
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle for loops with variable declarations and updates")]
    public void TypecheckerForLoopWithDeclarations()
    {
        string input = @"
                setup{}
                update{
                    for (int i = 0; i < 10; i = i + 1) {
                        int x = i * 2;
                    }
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle nested loops with multiple control flow statements")]
    public void TypecheckerNestedLoops()
    {
        string input = @"
                setup{}
                update{
                    for (int i = 0; i < 5; i = i + 1) {
                        int x = i;
                        while (x < 10) {
                            x = x + 1;
                            if (x == 7) {
                                break;
                            }
                        }
                    }
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle complex control flow with if-else, loops, and function calls")]
    public void TypecheckerComplexControlFlow()
    {
        string input = @"
                int calculate(int a, int b) {
                    return a + b;
                }
                setup{}
                update{
                    int x = 5;
                    int y = 10;
                    if (x < y) {
                        for (int i = 0; i < x; i = i + 1) {
                            x = calculate(x, i);
                        }
                    } else {
                        while (y > 0) {
                            y = y - 1;
                        }
                    }
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }
}