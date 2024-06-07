using System.ComponentModel;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Array;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Assignment;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.BitwiseExpr;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.CompExpr;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Expression;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.NumExpr;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.PinExpr;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Types;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.UnaryExpr;
using P4.TinyCell.Shared.Language.CodeGen;

namespace P4.TinyCell.Tests.UnitTests.Codegen;

public class CodegenExpressions
{
    [Fact]
    [Description("Verifies that the code generator correctly translates a BitshiftLExprNode to C code")]
    public void CodegenBitshiftLExpressionFromAST()
    {
        var leftNode = new IntNode(1);
        var rightNode = new IntNode(2);
        var bitshiftLExprNode = new BitshiftLExprNode(leftNode, rightNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitBitshiftLExprNode(bitshiftLExprNode);

        Assert.Equal("1 << 2", cCode);
    }

    [Fact]
    [Description("Verifies that the code generator correctly translates a BitshiftRExprNode to C code")]
    public void CodegenBitshiftRExpressionFromAST()
    {
        var leftNode = new IntNode(1);
        var rightNode = new IntNode(2);
        var bitshiftRExprNode = new BitshiftRExprNode(leftNode, rightNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitBitshiftRExprNode(bitshiftRExprNode);

        Assert.Equal("1 >> 2", cCode);
    }

    [Fact]
    [Description("Verifies that the code generator correctly translates an EqualExprNode to C code")]
    public void CodegenEqualExpressionFromAST()
    {
        var leftNode = new IntNode(1);
        var rightNode = new IntNode(2);
        var equalExprNode = new EqualExprNode(leftNode, rightNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitEqualExprNode(equalExprNode);

        Assert.Equal("1 == 2", cCode);
    }

    [Fact]
    [Description("Verifies that the code generator correctly translates a GreaterThanEqualExprNode to C code")]
    public void CodegenGreaterThanEqualExpressionFromAST()
    {
        var leftNode = new IntNode(1);
        var rightNode = new IntNode(2);
        var greaterThanEqualExprNode = new GreaterThanEqualExprNode(leftNode, rightNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitGreaterThanEqualExprNode(greaterThanEqualExprNode);

        Assert.Equal("1 >= 2", cCode);
    }

    [Fact]
    [Description("Verifies that the code generator correctly translates a GreaterThanExprNode to C code")]
    public void CodegenGreaterThanExpressionFromAST()
    {
        var leftNode = new IntNode(1);
        var rightNode = new IntNode(2);
        var greaterThanExprNode = new GreaterThanExprNode(leftNode, rightNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitGreaterThanExprNode(greaterThanExprNode);

        Assert.Equal("1 > 2", cCode);
    }

    [Fact]
    [Description("Verifies that the code generator correctly translates a LessThanEqualExprNode to C code")]
    public void CodegenLessThanEqualExpressionFromAST()
    {
        var leftNode = new IntNode(1);
        var rightNode = new IntNode(2);
        var lessThanEqualExprNode = new LessThanEqualExprNode(leftNode, rightNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitLessThanEqualExprNode(lessThanEqualExprNode);

        Assert.Equal("1 <= 2", cCode);
    }

    [Fact]
    [Description("Verifies that the code generator correctly translates a LessThanExprNode to C code")]
    public void CodegenLessThanExpressionFromAST()
    {
        var leftNode = new IntNode(1);
        var rightNode = new IntNode(2);
        var lessThanExprNode = new LessThanExprNode(leftNode, rightNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitLessThanExprNode(lessThanExprNode);

        Assert.Equal("1 < 2", cCode);
    }

    [Fact]
    [Description("Verifies that the code generator correctly translates a NotEqualExprNode to C code")]
    public void CodegenNotEqualExpressionFromAST()
    {
        var leftNode = new IntNode(1);
        var rightNode = new IntNode(2);
        var notEqualExprNode = new NotEqualExprNode(leftNode, rightNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitNotEqualExprNode(notEqualExprNode);

        Assert.Equal("1 != 2", cCode);
    }

    // [Fact]
    // [Description("Verifies that the code generator correctly translates a NegativeExpressionNode to C code")]
    // public void CodegenNegativeExpressionFromAST()
    // {
    //     var intNode = new IntNode(1);
    //     var negativeExpressionNode = new NegativeExpressionNode(intNode);

    //     var cGenerator = new CGeneratorVisitor();

    //     var cCode = cGenerator.VisitNegativeExpressionNode(negativeExpressionNode);

    //     Assert.Equal("-1", cCode);
    // }

    [Fact]
    [Description("Verifies that the code generator correctly translates an AddExprNode to C code")]
    public void CodegenAddExpressionFromAST()
    {
        var leftNode = new IntNode(1);
        var rightNode = new IntNode(2);
        var addExprNode = new AddExprNode(leftNode, rightNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitAddExprNode(addExprNode);

        Assert.Equal("1 + 2", cCode);
    }

    [Fact]
    [Description("Verifies that the code generator correctly translates an AndExprNode to C code")]
    public void CodegenAndExpressionFromAST()
    {
        var leftNode = new IntNode(1);
        var rightNode = new IntNode(2);
        var andExprNode = new AndExprNode(leftNode, rightNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitAndExprNode(andExprNode);

        Assert.Equal("1 && 2", cCode);
    }

    [Fact]
    [Description("Verifies that the code generator correctly translates a DivExprNode to C code")]
    public void CodegenDivExpressionFromAST()
    {
        var leftNode = new IntNode(1);
        var rightNode = new IntNode(2);
        var divExprNode = new DivExprNode(leftNode, rightNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitDivExprNode(divExprNode);

        Assert.Equal("1 / 2", cCode);
    }

    [Fact]
    [Description("Verifies that the code generator correctly translates a ModExprNode to C code")]
    public void CodegenModExpressionFromAST()
    {
        var leftNode = new IntNode(1);
        var rightNode = new IntNode(2);
        var modExprNode = new ModExprNode(leftNode, rightNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitModExprNode(modExprNode);

        Assert.Equal("1 % 2", cCode);
    }

    [Fact]
    [Description("Verifies that the code generator correctly translates a MultExprNode to C code")]
    public void CodegenMultExpressionFromAST()
    {
        var leftNode = new IntNode(1);
        var rightNode = new IntNode(2);
        var multExprNode = new MultExprNode(leftNode, rightNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitMultExprNode(multExprNode);

        Assert.Equal("1 * 2", cCode);
    }

    [Fact]
    [Description("Verifies that the code generator correctly translates an OrExprNode to C code")]
    public void CodegenOrExpressionFromAST()
    {
        var leftNode = new IntNode(1);
        var rightNode = new IntNode(2);
        var orExprNode = new OrExprNode(leftNode, rightNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitOrExprNode(orExprNode);

        Assert.Equal("1 || 2", cCode);
    }

    // [Fact]
    // [Description("Verifies that the code generator correctly translates a SubExprNode to C code")]
    // public void CodegenSubExpressionFromAST()
    // {
    //     var leftNode = new IntNode(1);
    //     var rightNode = new IntNode(2);
    //     var subExprNode = new SubExprNode(leftNode, rightNode);

    //     var cGenerator = new CGeneratorVisitor();

    //     var cCode = cGenerator.VisitSubExprNode(subExprNode);

    //     Assert.Equal("1 - 2", cCode);
    // }

    [Fact]
    [Description("Verifies that the code generator correctly translates a NotExprNode to C code")]
    public void CodegenNotExpressionFromAST()
    {
        var intNode = new IntNode(1);
        var notExprNode = new NotExprNode(intNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitNotExprNode(notExprNode);

        Assert.Equal("!1", cCode);
    }

    // UnaryMinusExprNode
    // [Fact]
    // [Description("Verifies that the code generator correctly translates a UnaryMinusExprNode to C code")]
    // public void CodegenUnaryMinusExpressionFromAST()
    // {
    //     var intNode = new IntNode(1);
    //     var unaryMinusExprNode = new UnaryMinusExprNode(intNode);

    //     var cGenerator = new CGeneratorVisitor();

    //     var cCode = cGenerator.VisitUnaryMinusExprNode(unaryMinusExprNode);

    //     Assert.Equal("-1", cCode);
    // }

    // UnaryPlusExprNode
    // [Fact]
    // [Description("Verifies that the code generator correctly translates a UnaryPlusExprNode to C code")]
    // public void CodegenUnaryPlusExpressionFromAST()
    // {
    //     var intNode = new IntNode(1);
    //     var unaryPlusExprNode = new UnaryPlusExprNode(intNode);

    //     var cGenerator = new CGeneratorVisitor();

    //     var cCode = cGenerator.VisitUnaryPlusExprNode(unaryPlusExprNode);

    //     Assert.Equal("+1", cCode);
    // }

    // These are more related to statements than expressions, but they are still expressions

    [Fact]
    [Description("Verifies that an ArrayDeclarationNode is correctly converted to C code")]
    public void CodegenArrayDeclarationStatementFromAST()
    {
        var typeNode = new TypeNode(TcType.INT);
        var identifierNode = new IdentifierNode("e");
        var sizeNode = new IntNode(5);
        var elementsNode = new ArrayElementsNode(new AstNode[]
            { new IntNode(1), new IntNode(2), new IntNode(3), new IntNode(4) });
        var arrayDeclarationNode = new ArrayDeclarationNode(typeNode, identifierNode, sizeNode, elementsNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitArrayDeclarationNode(arrayDeclarationNode);

        Assert.Equal("int e[5] = {1, 2, 3, 4}", cCode);
    }

    [Fact]
    [Description("Verifies that an AssignNode is correctly converted to C code")]
    public void CodegenAssignmentStatementFromAST()
    {
        var identifierNode = new IdentifierNode("x");
        var valueNode = new IntNode(5);
        var assignNode = new AssignNode(identifierNode, valueNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitAssignNode(assignNode);

        Assert.Equal("x = 5", cCode);
    }

    [Fact]
    [Description("Verifies that a DivAssignNode is correctly converted to C code")]
    public void CodegenDivAssignStatementFromAST()
    {
        var identifierNode = new IdentifierNode("x");
        var valueNode = new IntNode(5);
        var divAssignNode = new DivAssignNode(identifierNode, valueNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitDivAssignNode(divAssignNode);

        Assert.Equal("x /= 5", cCode);
    }

    [Fact]
    [Description("Verifies that a ModAssignNode is correctly converted to C code")]
    public void CodegenModAssignStatementFromAST()
    {
        var identifierNode = new IdentifierNode("x");
        var valueNode = new IntNode(5);
        var modAssignNode = new ModAssignNode(identifierNode, valueNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitModAssignNode(modAssignNode);

        Assert.Equal("x %= 5", cCode);
    }

    [Fact]
    [Description("Verifies that a MulAssignNode is correctly converted to C code")]
    public void CodegenMulAssignStatementFromAST()
    {
        var identifierNode = new IdentifierNode("x");
        var valueNode = new IntNode(5);
        var mulAssignNode = new MultAssignNode(identifierNode, valueNode);

        var cGenerator = new CGeneratorVisitor();

        var cCode = cGenerator.VisitMultAssignNode(mulAssignNode);

        Assert.Equal("x *= 5", cCode);
    }
}