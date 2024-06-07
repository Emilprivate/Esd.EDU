using System.ComponentModel;
using Antlr4.Runtime;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree;
using P4.TinyCell.Shared.Language.CodeGen;
using P4.TinyCell.Shared.Language.Typechecking;

namespace P4.TinyCell.Tests.IntegrationTests;

public class FullCompilationFlow
{
    [Fact]
    [Description(
        "Tests the full compilation flow from lexical analysis to C code generation for a complete function with various constructs")]
    public void FullCompilationFlowGeneral()
    {
        var input = @"
        int max(int a, int b) {
            if (a > b) {
                return a;
            } else {
                return b;
            }
            return 0;
        }
        int main() {
            int x = 10;
            int y = 20;
            return max(x, y);
        }";

        var lexer = new TinyCellLexer(new AntlrInputStream(input));
        var tokens = new CommonTokenStream(lexer);

        var parser = new TinyCellParser(tokens);
        var astBuilder = new AstBuilderVisitor();
        var rootNode = astBuilder.Visit(parser.document());

        var typeChecker = new TypeCheckerVisitor();
        var typeCheckException = Record.Exception(() => typeChecker.Visit(rootNode));
        Assert.Null(typeCheckException);

        var cGenerator = new CGeneratorVisitor();
        var cCode = cGenerator.Visit(rootNode);

        Assert.Contains("int max(int a, int b)", cCode);
        Assert.Contains("if(a > b)", cCode);
        Assert.Contains("return a;", cCode);
        Assert.Contains("return b;", cCode);
        Assert.Contains("int main()", cCode);
        Assert.Contains("return max(x, y);", cCode);
    }

    [Fact]
    [Description("Tests the full compilation flow for handling complex arithmetic and unary operators")]
    public void FullCompilationFlowAdvancedArithmetic()
    {
        var input = @"
        setup{
            int num = -(-2) - -(-(-2));
        }
        update{
        }
        ";

        var lexer = new TinyCellLexer(new AntlrInputStream(input));
        var tokens = new CommonTokenStream(lexer);

        var parser = new TinyCellParser(tokens);
        var astBuilder = new AstBuilderVisitor();
        var rootNode = astBuilder.Visit(parser.document());

        var typeChecker = new TypeCheckerVisitor();
        var typeCheckException = Record.Exception(() => typeChecker.Visit(rootNode));
        Assert.Null(typeCheckException);

        var cGenerator = new CGeneratorVisitor();
        var cCode = cGenerator.Visit(rootNode);

        Assert.Contains("-(-(2))-", cCode);
    }

    [Fact]
    [Description("Tests the full compilation flow for array handling and function interaction")]
    public void FullCompilationFlowArrayAndFunctions()
    {
        var input = @"
        int func(int nums[], int num) {
            num = nums[1];
            return num;
        }
        setup{
            int d[5];
            int e[5] = {1, 2, 3, 4};
            d[0] = 1;
            d[2] = e[0];
            int i = 2;
            d[i] = 1;
            func(d, i);
        }
        update{
        }
        ";

        var lexer = new TinyCellLexer(new AntlrInputStream(input));
        var tokens = new CommonTokenStream(lexer);

        var parser = new TinyCellParser(tokens);
        var astBuilder = new AstBuilderVisitor();
        var rootNode = astBuilder.Visit(parser.document());

        var typeChecker = new TypeCheckerVisitor();
        var typeCheckException = Record.Exception(() => typeChecker.Visit(rootNode));
        Assert.Null(typeCheckException);

        var cGenerator = new CGeneratorVisitor();
        var cCode = cGenerator.Visit(rootNode);

        Assert.Contains("int func(int nums[], int num)", cCode);
        Assert.Contains("num = nums[1];", cCode);
        Assert.Contains("return num;", cCode);
        Assert.Contains("d[2] = e[0];", cCode);
        Assert.Contains("func(d, i);", cCode);
    }

    [Fact]
    [Description("Tests the full compilation flow for control structures and local variable scopes")]
    public void FullCompilationFlowControlStructures()
    {
        var input = @"
        setup{
            while (1) {
                int num2 = 2;
                break;
            }
        }
        update{
            int num2 = 2;
            break;
        }
        ";

        var lexer = new TinyCellLexer(new AntlrInputStream(input));
        var tokens = new CommonTokenStream(lexer);

        var parser = new TinyCellParser(tokens);
        var astBuilder = new AstBuilderVisitor();
        var rootNode = astBuilder.Visit(parser.document());

        var typeChecker = new TypeCheckerVisitor();
        var typeCheckException = Record.Exception(() => typeChecker.Visit(rootNode));
        Assert.Null(typeCheckException);

        var cGenerator = new CGeneratorVisitor();
        var cCode = cGenerator.Visit(rootNode);

        Assert.Contains("while(1)", cCode);
        Assert.Contains("int num2 = 2;", cCode);
        Assert.Contains("break;", cCode);
    }

    [Fact]
    [Description("Tests the full compilation flow for digital pin assignments and operations")]
    public void FullCompilationFlowDigitalPinOperations()
    {
        var input = @"
        setup{
            dpin led = 6;
            write true to led;
            bool state = true;
            read led to state;
        }
        update{
            dpin led = 6;
            write false to led;
        }
        ";

        var lexer = new TinyCellLexer(new AntlrInputStream(input));
        var tokens = new CommonTokenStream(lexer);

        var parser = new TinyCellParser(tokens);
        var astBuilder = new AstBuilderVisitor();
        var rootNode = astBuilder.Visit(parser.document());

        var typeChecker = new TypeCheckerVisitor();
        var typeCheckException = Record.Exception(() => typeChecker.Visit(rootNode));
        Assert.Null(typeCheckException);

        var cGenerator = new CGeneratorVisitor();
        var cCode = cGenerator.Visit(rootNode);

        Assert.Contains("digitalWrite(led, false);", cCode);
        Assert.Contains("digitalRead(led);", cCode);
        Assert.Contains("digitalWrite(led, true);", cCode);
    }
}