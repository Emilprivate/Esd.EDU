using static P4.TinyCell.Tests.Utility;
using P4.TinyCell.Shared.Language.Typechecking;
using Antlr4.Runtime;
using P4.TinyCell.Shared.Utilities;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree;
using System.ComponentModel;

namespace P4.TinyCell.Tests.UnitTests.Typechecker;

public class TypecheckerOperators
{
    [Fact]
    [Description("Can handle addition operator")]
    public void TypecheckerAdditionOperator()
    {
        string input = @"
                setup{}
                update{
                    int x;
                    x = 5 + 3;
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle subtraction operator")]
    public void TypecheckerSubtractionOperator()
    {
        string input = @"
                setup{}
                update{
                    int x;
                    x = 5 - 3;
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle multiplication operator")]
    public void TypecheckerMultiplicationOperator()
    {
        string input = @"
                setup{}
                update{
                    int x;
                    x = 5 * 3;
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle division operator")]
    public void TypecheckerDivisionOperator()
    {
        string input = @"
                setup{}
                update{
                    int x;
                    x = 6 / 3;
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle modulus operator")]
    public void TypecheckerModulusOperator()
    {
        string input = @"
                setup{}
                update{
                    int x;
                    x = 5 % 3;
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle addition assignment operator")]
    public void TypecheckerPlusAssignOperator()
    {
        string input = @"
                setup{}
                update{
                    int x;
                    x = 5;
                    x += 3;
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle subtraction assignment operator")]
    public void TypecheckerMinusAssignOperator()
    {
        string input = @"
                setup{}
                update{
                    int x;
                    x = 5;
                    x -= 3;
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle multiplication assignment operator")]
    public void TypecheckerMultAssignOperator()
    {
        string input = @"
                setup{}
                update{
                    int x;
                    x = 5;
                    x *= 3;
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle division assignment operator")]
    public void TypecheckerDivAssignOperator()
    {
        string input = @"
                setup{}
                update{
                    int x;
                    x = 6;
                    x /= 3;
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle modulus assignment operator")]
    public void TypecheckerModAssignOperator()
    {
        string input = @"
                setup{}
                update{
                    int x;
                    x = 5;
                    x %= 3;
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle equality comparison operator")]
    public void TypecheckerEqualityOperator()
    {
        string input = @"
                setup{}
                update{
                    bool result;
                    result = (5 == 3);
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle inequality comparison operator")]
    public void TypecheckerInequalityOperator()
    {
        string input = @"
                setup{}
                update{
                    bool result;
                    result = (5 != 3);
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle greater than comparison operator")]
    public void TypecheckerGreaterThanOperator()
    {
        string input = @"
                setup{}
                update{
                    bool result;
                    result = (5 > 3);
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle less than comparison operator")]
    public void TypecheckerLessThanOperator()
    {
        string input = @"
                setup{}
                update{
                    bool result;
                    result = (5 < 3);
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle greater than or equal comparison operator")]
    public void TypecheckerGreaterThanOrEqualOperator()
    {
        string input = @"
                setup{}
                update{
                    bool result;
                    result = (5 >= 3);
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle less than or equal comparison operator")]
    public void TypecheckerLessThanOrEqualOperator()
    {
        string input = @"
                setup{}
                update{
                    bool result;
                    result = (5 <= 3);
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle logical AND operator")]
    public void TypecheckerLogicalAndOperator()
    {
        string input = @"
                setup{}
                update{
                    bool result;
                    result = (true && false);
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle logical OR operator")]
    public void TypecheckerLogicalOrOperator()
    {
        string input = @"
                setup{}
                update{
                    bool result;
                    result = (true || false);
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle logical NOT operator")]
    public void TypecheckerLogicalNotOperator()
    {
        string input = @"
                setup{}
                update{
                    bool result;
                    result = !true;
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle bitwise left shift operator")]
    public void TypecheckerBitwiseLeftShiftOperator()
    {
        string input = @"
                setup{}
                update{
                    int result;
                    result = (5 << 1);
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle bitwise right shift operator")]
    public void TypecheckerBitwiseRightShiftOperator()
    {
        string input = @"
                setup{}
                update{
                    int result;
                    result = (5 >> 1);
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }

    [Fact]
    [Description("Can handle mixed arithmetic and logical operators")]
    public void TypecheckerMixedOperators()
    {
        string input = @"
                setup{}
                update{
                    bool result;
                    result = ((5 + 3) > 2) && ((5 - 3) < 4);
                }
            ";

        var ex = CheckTypeErrors(input);
        Assert.Null(ex);
    }
}