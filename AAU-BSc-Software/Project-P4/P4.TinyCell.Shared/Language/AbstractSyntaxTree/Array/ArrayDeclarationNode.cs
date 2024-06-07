using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Function;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Types;

namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Array;

public class ArrayDeclarationNode : AstNode
{
    public TypeNode TypeNode { get; set; }
    public IdentifierNode Identifier { get; set; }
    public AstNode Size { get; set; }
    public ArrayElementsNode? Elements { get; set; }
    public FunctionCallNode? FunctionCall { get; set; }

    public ArrayDeclarationNode(TypeNode typeNode, IdentifierNode identifier, AstNode size)
    {
        TypeNode = typeNode;
        Identifier = identifier;
        Size = size;

        AddChild(TypeNode);
        AddChild(identifier);
        AddChild(size);
    }

    public ArrayDeclarationNode(TypeNode typeNode, IdentifierNode identifier, AstNode size,
        ArrayElementsNode arrayElements)
    {
        TypeNode = typeNode;
        Size = size;
        Identifier = identifier;
        Elements = arrayElements;

        AddChild(TypeNode);
        AddChild(identifier);
        AddChild(size);
        AddChild(Elements);
    }

    // public ArrayDeclarationNode(TypeNode typeNode, IdentifierNode identifier, AstNode size, FunctionCallNode functionCall)
    // {
    //     TypeNode = typeNode;
    //     Size = size;
    //     Identifier = identifier;
    //     FunctionCall = functionCall;

    //     AddChild(TypeNode);
    //     AddChild(identifier);
    //     AddChild(size);
    //     AddChild(functionCall);
    // }

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitArrayDeclarationNode(this);
    }
}