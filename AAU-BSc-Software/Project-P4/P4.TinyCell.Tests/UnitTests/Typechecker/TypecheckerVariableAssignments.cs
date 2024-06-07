using static P4.TinyCell.Tests.Utility;
using P4.TinyCell.Shared.Language.Typechecking;
using Antlr4.Runtime;
using P4.TinyCell.Shared.Utilities;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree;
using System.ComponentModel;

namespace P4.TinyCell.Tests.UnitTests.Typechecker;

public class TypecheckerVariableAssignments
{
    [Fact]
    [Description("Can handle a variable declaration and assignment")]
    public void TypecheckerVarDeclAssignInt()
    {
        string input = @"
                setup{}
                update{
                    int x;
                    x = 5;
                }
            ";

        var ex = CheckTypeErrors(input);

        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle a variable declaration and assignment with a string")]
    public void TypecheckerVarDeclAssignString()
    {
        string input = @"
                setup{}
                update{
                    string x;
                    x = ""hello"";
                }
            ";

        var ex = CheckTypeErrors(input);

        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle a variable declaration and assignment with a boolean")]
    public void TypecheckerVarDeclAssignBool()
    {
        string input = @"
                setup{}
                update{
                    bool x;
                    x = true;
                }
            ";

        var ex = CheckTypeErrors(input);

        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle a variable declaration and assignment with a float")]
    public void TypecheckerVarDeclAssignFloat()
    {
        string input = @"
                setup{}
                update{
                    float x;
                    x = 5.0;
                }
            ";

        var ex = CheckTypeErrors(input);

        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle an array variable declaration and assignment")]
    public void TypecheckerVarDeclAssignArray()
    {
        string input = @"
                setup{}
                update{
                    int e[5] = {1,2,3,4};
                }
            ";

        var ex = CheckTypeErrors(input);

        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle a variable declaration and assignment with a function")]
    public void TypecheckerVarDeclAssignFunction()
    {
        string input = @"
                int test() {
                    return 5;
                }
                setup{}
                update{
                    int x;
                    x = test();
                    x = x + 5;
                }
            ";

        var ex = CheckTypeErrors(input);

        Assert.Null(ex);
    }
}