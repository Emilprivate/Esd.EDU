using static P4.TinyCell.Tests.Utility;
using P4.TinyCell.Shared.Language.Typechecking;
using Antlr4.Runtime;
using P4.TinyCell.Shared.Utilities;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree;
using System.ComponentModel;

namespace P4.TinyCell.Tests.UnitTests.Typechecker;

public class TypecheckerErrorHandling
{
    [Fact]
    [Description("Ensures type mismatch in variable assignment is caught")]
    public void TypecheckerVarAssignTypeMismatch()
    {
        string input = @"
            setup{}
            update{
                int x;
                x = ""imposter int"";
            }
        ";

        var ex = CheckTypeErrors(input);

        Assert.NotNull(ex);
        Assert.Contains("type mismatch", ex.Message.ToLower());
    }

    [Fact]
    [Description("Ensures type mismatch in function return is caught")]
    public void TypecheckerFunctionReturnTypeMismatch()
    {
        string input = @"
            int myFunction() {
                return ""imposter int"";
            }
            setup{}
            update{}
        ";

        var ex = CheckTypeErrors(input);

        Assert.NotNull(ex);
        Assert.Contains("type mismatch", ex.Message.ToLower());
    }

    [Fact]
    [Description("Ensures usage of an undeclared variable is caught")]
    public void TypecheckerUndeclaredVariable()
    {
        string input = @"
        setup{}
        update{
            x = 10; // 'x' is not declared anywhere
        }
    ";

        var ex = CheckTypeErrors(input);

        Assert.NotNull(ex);
        Assert.Contains("not declared", ex.Message.ToLower());
    }

    [Fact]
    [Description("Ensures return type mismatches in conditional branches are caught")]
    public void TypecheckerConditionalReturnTypeMismatch()
    {
        string input = @"
        int check(bool cond) {
            if (cond) {
                return 1;
            } else {
                return ""false""; // Should return an int, not a string
            }
        }
        setup{}
        update{}
    ";

        var ex = CheckTypeErrors(input);

        Assert.NotNull(ex);
        Assert.Contains("type mismatch", ex.Message.ToLower());
    }

    [Fact]
    [Description("Ensures type mismatch in logical operations is caught")]
    public void TypecheckerLogicalOperationTypeMismatch()
    {
        string input = @"
        setup{}
        update{
            bool result = true && 123; // Logical AND between boolean and integer
        }
    ";

        var ex = CheckTypeErrors(input);

        Assert.NotNull(ex);
        Assert.Contains("type mismatch", ex.Message.ToLower());
    }
}