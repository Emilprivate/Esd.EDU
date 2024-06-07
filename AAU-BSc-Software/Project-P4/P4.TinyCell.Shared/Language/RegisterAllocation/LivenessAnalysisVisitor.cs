using P4.TinyCell.Shared.Language.AbstractSyntaxTree;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Expression;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Assignment;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Statement;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.PinExpr;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Function;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.UnaryExpr;
using P4.TinyCell.Shared.Utilities;

namespace P4.TinyCell.Shared.Language.RegisterAllocation
{
    public class LivenessAnalysisVisitor : AstBaseVisitor<HashSet<string>>
    {
        private List<IInstruction> lastInstructions = new();

        private List<IInstruction> prevInstructions = new();

        private bool firstInstruction = false;

        Stack<List<string>> currentVariables = new();
        private Stack<IInstruction> parentInstructions = new();
        public Dictionary<string, List<IInstruction>> Scopes { get; set; } = new();
        private Stack<Dictionary<string, int>> toBeRenamed = new();

        public override HashSet<string> VisitChildren(AstNode node)
        {
            HashSet<string> res = new();

            foreach (AstNode child in node.Children)
            {
                res.UnionWith(child.Accept(this));
            }

            return res;
        }

        public override HashSet<string> VisitRootNode(RootNode rootNode)
        {
            Scopes.Add("global", new List<IInstruction>());
            currentVariables.Push(new List<string>());
            VisitChildren(rootNode);
            FixedPointAnalysis();
            return new HashSet<string>();
        }

        public override HashSet<string> VisitUnaryMinusExprNode(UnaryMinusExprNode unaryExpressionNode)
        {
            var instruction = new Instruction<UnaryMinusExprNode>(unaryExpressionNode);
            AddInstruction(instruction);
            var gens = Visit(unaryExpressionNode.Operand);
            foreach (var gen in gens)
            {
                instruction.addGen(gen);
                instruction.addKill(gen);
            }

            return gens;
        }

        public override HashSet<string> VisitUnaryPlusExprNode(UnaryPlusExprNode unaryExpressionNode)
        {
            var instruction = new Instruction<UnaryPlusExprNode>(unaryExpressionNode);
            AddInstruction(instruction);
            var gens = Visit(unaryExpressionNode.Operand);
            foreach (var gen in gens)
            {
                instruction.addGen(gen);
                instruction.addKill(gen);
            }

            return gens;
        }

        public override HashSet<string> VisitDeclarationNode(DeclarationNode declarationNode)
        {
            declarationNode.Identifier.Value = CheckPrevId(declarationNode.Identifier.Value);
            var id = declarationNode.Identifier.Value;
            var instruction = new Instruction<DeclarationNode>(declarationNode);
            instruction.addKill(id);
            if (declarationNode.Action != null)
            {
                HashSet<string> res = Visit(declarationNode.Action);
                foreach (var identifier in res)
                {
                    instruction.addGen(identifier);
                }
            }

            AddInstruction(instruction);
            return new HashSet<string>();
        }

        public override HashSet<string> VisitIdentifierNode(IdentifierNode identifierNode)
        {
            foreach (var stack in toBeRenamed)
            {
                if (stack.ContainsKey(identifierNode.Value))
                {
                    identifierNode.Value = $"{identifierNode.Value}_{stack[identifierNode.Value]}";
                    break;
                }
            }

            HashSet<string> res = [identifierNode.Value];
            return res;
        }

        public override HashSet<string> VisitAssignNode(AssignNode assignmentNode)
        {
            return VisitAssignNodeHelper(assignmentNode);
        }

        public override HashSet<string> VisitPlusAssignNode(PlusAssignNode plusAssignNode)
        {
            return VisitAssignNodeHelper(plusAssignNode);
        }

        public override HashSet<string> VisitMinusAssignNode(MinusAssignNode minusAssignNode)
        {
            return VisitAssignNodeHelper(minusAssignNode);
        }

        public override HashSet<string> VisitDivAssignNode(DivAssignNode divAssignNode)
        {
            return VisitAssignNodeHelper(divAssignNode);
        }

        public override HashSet<string> VisitMultAssignNode(MultAssignNode mulAssignNode)
        {
            return VisitAssignNodeHelper(mulAssignNode);
        }

        public override HashSet<string> VisitModAssignNode(ModAssignNode modAssignNode)
        {
            return VisitAssignNodeHelper(modAssignNode);
        }

        public override HashSet<string> VisitPinReadExprNode(PinReadExprNode pinReadExprNode)
        {
            return VisitPinExprHelper(pinReadExprNode);
        }

        public override HashSet<string> VisitPinWriteExprNode(PinWriteExprNode pinWriteExprNode)
        {
            return VisitPinExprHelper(pinWriteExprNode);
        }

        public override HashSet<string> VisitPinModeExprNode(PinModeExprNode pinModeExprNode)
        {
            var instruction = new Instruction<PinModeExprNode>(pinModeExprNode);
            AddInstruction(instruction);
            instruction.addKill(pinModeExprNode.Identifier.Value);
            return new HashSet<string>();
        }


        public override HashSet<string> VisitFunctionDefinitionNode(FunctionDefinitionNode functionDefinitionNode)
        {
            Scopes.Add(functionDefinitionNode.Identifier.Value, new List<IInstruction>());
            toBeRenamed.Push(new Dictionary<string, int>());
            VisitChildren(functionDefinitionNode);
            toBeRenamed.Pop();
            return new HashSet<string>();
        }

        public override HashSet<string> VisitIfStatementNode(IfStatementNode ifStatementNode)
        {
            var instruction = new Instruction<IfStatementNode>(ifStatementNode);
            AddInstruction(instruction);
            parentInstructions.Push(instruction);
            var gens = Visit(ifStatementNode.Condition);
            foreach (var gen in gens)
            {
                instruction.addGen(gen);
            }

            if (ifStatementNode.TrueExpr.Children.Count > 0)
            {
                toBeRenamed.Push(new Dictionary<string, int>());

                firstInstruction = true;
                Visit(ifStatementNode.TrueExpr);
                lastInstructions.AddRange(prevInstructions);
                toBeRenamed.Pop();
                if (ifStatementNode.ElseExpr != null && ifStatementNode.ElseExpr.Children.Count > 0)
                {
                    toBeRenamed.Push(new Dictionary<string, int>());
                    prevInstructions.Clear();
                    firstInstruction = true;
                    Visit(ifStatementNode.ElseExpr);
                    lastInstructions.AddRange(prevInstructions);
                    toBeRenamed.Pop();
                }
                else

                {
                    prevInstructions.Clear();
                    prevInstructions.Add(instruction);
                    prevInstructions.AddRange(lastInstructions);
                }
            }

            parentInstructions.Pop();
            return new HashSet<string>();
        }

        public override HashSet<string> VisitForStatementNode(ForStatementNode forStatementNode)
        {
            var instruction = new Instruction<ForStatementNode>(forStatementNode);
            AddInstruction(instruction);
            parentInstructions.Push(instruction);
            var gens = Visit(forStatementNode.Condition);

            foreach (var gen in gens)
            {
                instruction.addGen(gen);
            }

            if (forStatementNode.CompoundStatement.Children.Count > 0)
            {
                Visit(forStatementNode.Variable);
                toBeRenamed.Push(new Dictionary<string, int>());
                prevInstructions.Clear();
                firstInstruction = true;
                Visit(forStatementNode.CompoundStatement);
                Visit(forStatementNode.Expression);
                prevInstructions.Clear();
                prevInstructions.Add(instruction);
                prevInstructions.AddRange(lastInstructions);
                toBeRenamed.Pop();
            }

            parentInstructions.Pop();
            return new HashSet<string>();
        }

        public override HashSet<string> VisitReturnNode(ReturnNode returnStatementNode)
        {
            var instruction = new Instruction<ReturnNode>(returnStatementNode);
            AddInstruction(instruction);
            var gens = Visit(returnStatementNode.ReturnExpression);
            foreach (var gen in gens)
            {
                instruction.addGen(gen);
            }

            return new HashSet<string>();
        }

        public override HashSet<string> VisitWhileStatementNode(WhileStatementNode whileStatementNode)
        {
            var instruction = new Instruction<WhileStatementNode>(whileStatementNode);
            AddInstruction(instruction);
            parentInstructions.Push(instruction);
            var gens = Visit(whileStatementNode.Condition);
            foreach (var gen in gens)
            {
                instruction.addGen(gen);
            }

            if (whileStatementNode.CompoundStatement.Children.Count > 0)
            {
                toBeRenamed.Push(new Dictionary<string, int>());
                firstInstruction = true;
                Visit(whileStatementNode.CompoundStatement);
                prevInstructions.Clear();
                prevInstructions.Add(instruction);
                prevInstructions.AddRange(lastInstructions);
                toBeRenamed.Pop();
            }

            parentInstructions.Pop();
            return new HashSet<string>();
        }

        public override HashSet<string> VisitFunctionCallNode(FunctionCallNode functionCallNode)
        {
            var instruction = new Instruction<FunctionCallNode>(functionCallNode);
            AddInstruction(instruction);
            var gens = Visit(functionCallNode.ArgumentList);
            foreach (var gen in gens)
            {
                instruction.addGen(gen);
            }

            return new HashSet<string>();
        }

        private string CheckPrevId(string id)
        {
            if (currentVariables.Peek().Contains(id))
            {
                return RenameId(id);
            }
            else
            {
                currentVariables.Peek().Add(id);
                return id;
            }
        }

        private string RenameId(string id)
        {
            foreach (var stack in toBeRenamed)
            {
                if (stack.ContainsKey(id))
                {
                    toBeRenamed.Peek().Add(id, stack[id] + 1);
                    return id += $"_{toBeRenamed.Peek()[id]}";
                }
            }

            toBeRenamed.Peek().Add(id, 0);
            return id += $"_{toBeRenamed.Peek()[id]}";
        }

        private void AddInstruction(IInstruction instruction)
        {
            if (firstInstruction)
            {
                parentInstructions.Peek().addSucc(instruction);
                prevInstructions.Clear();
                firstInstruction = false;
            }
            else
            {
                prevInstructions.ForEach(prevInstruction => prevInstruction.addSucc(instruction));
                prevInstructions.Clear();
            }

            prevInstructions.Add(instruction);
            Scopes.Last().Value.Add(instruction);
        }

        //<summary>
        //Performs fixed point analysis on <see cref="scopes"/>
        //</summary>
        public void FixedPointAnalysis()
        {
            foreach (var scopeInstructions in Scopes.Values)
            {
                if (scopeInstructions.Count == 0)
                {
                    continue;
                }

                InitializeFirstOut(scopeInstructions);
                List<IInstruction> instructionsCopy;
                do
                {
                    instructionsCopy = scopeInstructions.Select(instruction => (IInstruction)instruction.Clone())
                        .ToList();
                    for (int i = scopeInstructions.Count - 1; i >= 0; i--)
                    {
                        var instruction = scopeInstructions[i];
                        Update(instruction);
                    }
                } while (!IsListEqual(instructionsCopy, scopeInstructions));
            }
        }


        //<summary>
        // Makes sure that the last instruction <see cref="Instruction{T}.gen"></see> as its <see cref="Instruction{T}.ins"/>
        //</summary>
        //<param name="instructions"></param>
        private void InitializeFirstOut(List<IInstruction> instructions)
        {
            for (int i = instructions.Count - 1; i >= 0; i--)
            {
                if (instructions[i].getGen().Count != 0)
                {
                    var lastInstructionIns = instructions[i].getIns();
                    var lastInstructionGen = instructions[i].getGen();
                    lastInstructionIns.UnionWith(lastInstructionGen);
                    instructions[i].setIns(lastInstructionIns);
                    break;
                }
            }
        }


        private bool IsListEqual(List<IInstruction> list1, List<IInstruction> list2)
        {
            for (int i = 0; i < list1.Count; i++)
            {
                var instruction1 = list1[i];
                var instruction2 = list2[i];
                if (!areInstructionsEqual(instruction1, instruction2))
                {
                    return false;
                }
            }

            return true;
        }

        private bool areInstructionsEqual(IInstruction instruction1, IInstruction instruction2)
        {
            if (!instruction1.getIns().SetEquals(instruction2.getIns()))
            {
                return false;
            }

            if (!instruction1.getOuts().SetEquals(instruction2.getOuts()))
            {
                return false;
            }

            return true;
        }

        private void Update(IInstruction instruction)
        {
            UpdateOuts(instruction);
            UpdateIns(instruction);
        }

        private void UpdateOuts(IInstruction instruction)
        {
            var instructionOuts = instruction.getOuts();
            foreach (var succ in instruction.getSucc())
            {
                instructionOuts.UnionWith(succ.getIns());
            }

            instruction.setOuts(instructionOuts);
        }

        private void UpdateIns(IInstruction instruction)
        {
            var gen = instruction.getGen();
            var outs = instruction.getOuts();
            var kill = instruction.getKill();
            var outsMinusKill = new HashSet<string>(outs);
            outsMinusKill.ExceptWith(kill);
            var newIns = gen.Union(outsMinusKill).ToHashSet();
            instruction.setIns(newIns);
        }

        private HashSet<string> VisitAssignNodeHelper(AssignmentBaseNode assignmentNode)
        {
            if (toBeRenamed.Peek().ContainsKey(assignmentNode.Identifier.Value))
            {
                assignmentNode.Identifier.Value += $"_{toBeRenamed.Peek()[assignmentNode.Identifier.Value]}";
            }

            var id = assignmentNode.Identifier.Value;
            var instruction = new Instruction<AssignmentBaseNode>(assignmentNode);
            instruction.addKill(id);
            HashSet<string> res = Visit(assignmentNode.Expression);
            foreach (var identifier in res)
            {
                instruction.addGen(identifier);
            }

            AddInstruction(instruction);
            return new HashSet<string>();
        }

        private HashSet<string> VisitPinExprHelper(PinExprNode pinExprNode)
        {
            var instruction = new Instruction<PinExprNode>(pinExprNode);
            AddInstruction(instruction);
            var gens = Visit(pinExprNode.From);
            var kills = Visit(pinExprNode.To);
            foreach (var gen in gens)
            {
                instruction.addGen(gen);
            }

            foreach (var kill in kills)
            {
                instruction.addKill(kill);
            }

            return new HashSet<string>();
        }
    }
}